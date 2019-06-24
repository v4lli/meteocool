package com.meteocool.utility

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.meteocool.DocumentationFragment
import com.meteocool.MapFragment
import com.meteocool.R
import com.meteocool.location.WebAppInterface


class NavDrawerAdapter(private val activity : AppCompatActivity, private val layoutResourceId : Int, private val navDrawerItems: List<NavDrawerItem>)
    : ArrayAdapter<NavDrawerItem>(activity.applicationContext, layoutResourceId, navDrawerItems)
, AdapterView.OnItemClickListener{


    override fun onItemClick(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
        super.getPosition(getItem(position))
            when (getItem(position)!!.menuHeading) {
                activity.getString(R.string.map_header) -> {
                    activity.supportFragmentManager.beginTransaction().replace(R.id.fragmentContainer, MapFragment())
                        .commit()

                }
                activity.getString(R.string.menu_documentation) -> {
                    activity.supportFragmentManager.beginTransaction().replace(R.id.fragmentContainer, DocumentationFragment()).commit()
                }
            }
    }

    override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
        var listItem = convertView
        val inflater = context.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
        listItem = inflater.inflate(layoutResourceId, parent, false)
        val imageIcon = listItem.findViewById<ImageView>(R.id.drawerImgID)
        val menuHeader = listItem.findViewById<TextView>(R.id.drawerHeaderText)
        val folder = navDrawerItems[position]
        imageIcon.setImageResource(folder.imgID)
        menuHeader.setText(folder.menuHeading)
        return listItem
    }

}